using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using static Anotame.Models.Helpers;
using Anotame.Models;
namespace Anotame.Models
{
    public class QueryPrenda
    {
        //private readonly AnotameEntities db = new AnotameEntities();

        //public List<Busq> BusqPrendaT(string nombre)
        //{
        //    var data = (from p in db.Prenda
        //                join tp in db.TipoPrenda on p.idTipoPrenda equals tp.id
        //                join a in db.Arreglo on p.idArreglo equals a.id
        //                where tp.Nombre == nombre
        //                select new PrendaAux
        //                {
        //                    Cantidad = p.Cantidad,
        //                    NombrePrenda = tp.Nombre,
        //                    NombreAjuste = a.Nombre
        //                }).ToList();
        //    return data;
        //}
        //public List<PrendaAux> BusqArreglo(string nombre)
        //{
        //    var data = (from p in db.Prenda
        //                join tp in db.TipoPrenda on p.idTipoPrenda equals tp.id
        //                join a in db.Arreglo on p.idArreglo equals a.id
        //                where a.Nombre == nombre
        //                select new PrendaAux
        //                {
        //                    Cantidad = p.Cantidad,
        //                    NombrePrenda = tp.Nombre,
        //                    NombreAjuste = a.Nombre
        //                }).ToList();
        //    return data;
        //}

    }
}