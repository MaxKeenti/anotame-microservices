using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Anotame.Models;

namespace El_Hivan.Controllers
{
    public class NotaPrendaController : Controller
    {
        private readonly AnotameEntities db = new AnotameEntities();
        private readonly Response cnResponse = new Response();
        List<NotaConImpor_Result> NotaConImpor_Results = new List<NotaConImpor_Result>();

        // GET: NotaPrenda
        public ActionResult Index()
        {
            var notaPrenda = db.NotaPrenda.Include(n => n.Prenda).Include(n => n.Prenda);
            return View(notaPrenda.ToList());
        }

        // GET: NotaPrenda/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            NotaPrenda notaPrenda = db.NotaPrenda.Find(id);
            if (notaPrenda == null)
            {
                return HttpNotFound();
            }
            return View(notaPrenda);
        }

        // GET: NotaPrenda/Create
        public ActionResult Create()
        {
            ViewBag.idTipoPrenda = new SelectList(db.TipoPrenda, "id", "Nombre");
            ViewBag.idArreglo = new SelectList(db.Arreglo, "id", "Nombre");
            //ViewBag.idPrenda = new SelectList(db.Prenda, "id", "Descripcion");
            return View();
        }

        public JsonResult GetArreglo(int id)
        {
            return Json(db.TipoArregloYPrecio(id).Distinct());
        }

        public JsonResult GetPrecio(int? id, int? dato)
        {
            return Json(db.PrecioNotaPrenda(id, dato));
        }

        public JsonResult GetAll()
        {
            NotaConImpor_Results = db.NotaConImpor().ToList();
            decimal? Total = 0;
            for (int i = 0; i < NotaConImpor_Results.Count; i++)
            {
                Total += NotaConImpor_Results[i].Importe;
            }
            return Json(new { Lista = NotaConImpor_Results, Total });
        }



        // POST: NotaPrenda/Create
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "id,idNota,idPrenda,Descripcion,CantidadPrendas")] NotaPrenda notaPrenda)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    db.NotaPrenda.Add(notaPrenda);
                    db.SaveChanges();
                    return Json(cnResponse.AllOk());
                }

                ViewBag.idPrenda = new SelectList(db.Prenda, "id", "id", notaPrenda.idPrenda);
                //ViewBag.idPrenda = new SelectList(db.Prenda, "id", "Descripcion", notaPrenda.idPrenda);
                return Json(cnResponse.WentBad());
            }
            catch (Exception e)
            {
                return Json(cnResponse.ServerError(Url.Action(), e.Message));
            }


        }

        // GET: NotaPrenda/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            NotaPrenda notaPrenda = db.NotaPrenda.Find(id);
            if (notaPrenda == null)
            {
                return HttpNotFound();
            }
            ViewBag.idPrenda = new SelectList(db.Prenda, "id", "id", notaPrenda.idPrenda);
            //ViewBag.idPrenda = new SelectList(db.Prenda, "id", "Descripcion", notaPrenda.idPrenda);
            return View(notaPrenda);
        }

        // POST: NotaPrenda/Edit/5
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public ActionResult Edit([Bind(Include = "id,idNota,idPrenda,Descripcion,CantidadPrendas")] NotaPrenda notaPrenda)
        //{
        //    if (ModelState.IsValid)
        //    {
        //        db.Entry(notaPrenda).State = EntityState.Modified;
        //        db.SaveChanges();
        //        return View(notaPrenda);
        //    }
        //    ViewBag.idPrenda = new SelectList(db.Prenda, "id", "id", notaPrenda.idPrenda);
        //    //ViewBag.idPrenda = new SelectList(db.Prenda, "id", "Descripcion", notaPrenda.idPrenda);
        //    return View(notaPrenda);
        //}
        [HttpPost]
        public JsonResult Edit(FormCollection fd)
        {
            if (ModelState.IsValid)
            {
                NotaPrenda PrendaEdit = new NotaPrenda
                {
                    id = Convert.ToInt32(fd["idNotaPrendaEdit"]),
                    idPrenda = Convert.ToInt32(fd["idPrendaEdit"]),
                    Descripcion = fd["DescripcionEdit"],
                    CantidadPrendas = Convert.ToInt32(fd["CantidadPrendasEdit"])
                };

                db.Entry(PrendaEdit).State = EntityState.Modified;
                db.SaveChanges();
                //return View(notaPrenda);
                return Json(cnResponse.AllOk());
            }
            //ViewBag.idPrenda = new SelectList(db.Prenda, "id", "id", notaPrenda.idPrenda);
            //ViewBag.idPrenda = new SelectList(db.Prenda, "id", "Descripcion", notaPrenda.idPrenda);
            //return View(notaPrenda);
            return Json(cnResponse.WentBad());
        }
        // GET: NotaPrenda/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            NotaPrenda notaPrenda = db.NotaPrenda.Find(id);
            if (notaPrenda == null)
            {
                return HttpNotFound();
            }
            return View(notaPrenda);
        }

        // POST: NotaPrenda/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            NotaPrenda notaPrenda = db.NotaPrenda.Find(id);
            db.NotaPrenda.Remove(notaPrenda);
            db.SaveChanges();
            return View(notaPrenda);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
