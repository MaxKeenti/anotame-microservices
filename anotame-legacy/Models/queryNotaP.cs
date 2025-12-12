using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace Anotame.Models
{
    public class QueryNotaP
    {
        private readonly AnotameEntities db = new AnotameEntities();
        public void Update(int idNota)
        {
            var data = (from n in db.NotaPrenda
                        where n.idNota == null
                        select n).ToList();

            for (int i = 0; i < data.Count(); i++)
            {
                data[i].idNota = idNota;
                db.Entry(data[i]).State = EntityState.Modified;
                db.SaveChanges();
            }
            
        }

    }
}